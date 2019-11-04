### 开关问题
#### 题面描述
[POJ，总有一天会挂的](http://poj.org/problem?id=1830)
##### Description

有N个相同的开关，每个开关都与某些开关有着联系，每当你打开或者关闭某个开关的时候，其他的与此开关相关联的开关也会相应地发生变化，即这些相联系的开关的状态如果原来为开就变为关，如果为关就变为开。你的目标是经过若干次开关操作后使得最后N个开关达到一个特定的状态。对于任意一个开关，最多只能进行一次开关操作。你的任务是，计算有多少种可以达到指定状态的方法。（不计开关操作的顺序）
##### Input

输入第一行有一个数K，表示以下有K组测试数据。
每组测试数据的格式如下：
第一行 一个数N（0 < N < 29）
第二行 N个0或者1的数，表示开始时N个开关状态。
第三行 N个0或者1的数，表示操作结束后N个开关的状态。
接下来 每行两个数I J，表示如果操作第 I 个开关，第J个开关的状态也会变化。每组数据以 0 0 结束。
Output

如果有可行方法，输出总数，否则输出“Oh,it's impossible~!!” 不包括引号

##### Sample Input
```
2
3
0 0 0
1 1 1
1 2
1 3
2 1
2 3
3 1
3 2
0 0
3
0 0 0
1 0 1
1 2
2 1
0 0
```
##### Sample Output
```
4
Oh,it's impossible~!!
```

##### Hint

第一组数据的说明：
一共以下四种方法：
操作开关1
操作开关2
操作开关3
操作开关1、2、3 （不记顺序）

#### 题解
这到题目是真的巧妙。刚看题目，首先想到的是构图。但是并没有头绪。怎么办？

**高斯消元**。

观察到数据比较小，同时，对开关的操作非常像$xor$，而且有一系列的‘连锁反应’（我是在编不下去了）......所以我们选择：建立方程组来描述这个过程（这个思路是在是太巧妙了）。

令原图的邻接矩阵为$a$，令$x_i$表示第$i$个开关的操作情况，0则没有操作;反之有操作。我们要求的就是$\{x\}$解集的个数。有：
$$
\begin{cases}
a_{1,1}x_1\oplus a_{2,1}x_2\oplus \cdots \oplus a_{n,1}x_n = src_1 \oplus dest_1 \\
a_{1,2}x_1\oplus a_{2,2}x_2\oplus \cdots \oplus a_{n,2}x_n = src_2 \oplus dest_2 \\
\ldots\\
a_{1,1}x_1\oplus a_{2,1}x_2\oplus \cdots \oplus a_{n,1}x_n = src_n \oplus dest_n
\end{cases}
$$
我还不知道，高斯消元对于xor也适用。用高斯消元对以上方程组求解，若有唯一解（没有自由元）,则说明只有唯一的解集$\{x\}$符合题目限制。若有自由元，那么方案数就是$2{^\text{自由元的个数}}$。

这道题目实在是太巧妙了。

代码：
```cpp
#include<iostream>
#include<cstdlib>
#include<cstdio>
#include<cstring>
const int N = 30 + 3;

typedef long long value_type;
const char WAR[] = "Oh,it's impossible~!!";

int a[N],n;

namespace __run__
{

inline value_type gaussJordan()
{
	for(int i = 1;i <= n;i++) {
		int maxRow = i;
		for(int j = i + 1;j <= n;j++)
			if(a[maxRow] < a[j]) 
				maxRow = j;
		if(maxRow != i) std::swap(a[i],a[maxRow]);
		if(!a[i]) return 1 << (n - i + 1);
		if(a[i] == 1) return -1;
		for(int k = 1;k <= n;k++)/*FIXME*/
			if(a[i] >> k & 1) {
				for(int j = i + 1;j <= n;j++) /*FIXME*/
					if((a[j] >> k & 1))
						a[j] ^= a[i];
				break;
			}
	}

	return 1;
}

void main()
{
	std::cin >> n;
	for(int i = 1;i <= n;i++)
		std::cin >> a[i];
	for(int i = 1;i <= n;i++)
		a[i] |= (1 << i);
	for(int i = 1,tmp;i <= n;i++)
		std::cin >> tmp,a[i] ^= tmp;
	for(int x,y;std::cin >> x >> y && x && y;)
		a[y] |= (1 << x);

	value_type ret = gaussJordan();
	if(ret == -1) std::cout << WAR;
	else std::cout << ret;
	puts("");
}
};

int main()
{
	freopen("switch.in","r",stdin);
	freopen("switch.out","w",stdout);
	int k; std::cin >> k;
	while(k--) {
		memset(a,0,sizeof a);
		__run__::main();
	}

	exit(0);
}
```
